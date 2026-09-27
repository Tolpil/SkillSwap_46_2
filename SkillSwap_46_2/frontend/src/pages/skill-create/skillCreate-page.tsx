import { useEffect, useState, type FC } from "react";
import { SkillRegister } from "../../shared/ui/register";
import type { OptionType } from "../../shared/ui/dropdown/types";
import { useDispatch, useSelector } from "../../services/store";
import { useLocation, useNavigate } from "react-router-dom";
import { appendSkill, changeSkill, fetchSkillById } from "../../services/skill/actions";
import { handleError } from "../../utils/errors/errorUtils";
import type { TSkillData } from "../../utils/types";

export const SkillCreate: FC = () => {
  const [skillName, setSkillName] = useState("");
  const [skillSubcategory, setSkillSubcategory] = useState<OptionType | null>(
    null,
  );
  const [skillDescription, setSkillDescription] = useState("");
  const [skillImages, setSkillImages] = useState<string[]>([]);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [initializedSkillId, setInitializedSkillId] = useState<string | null>(
    null,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useSelector((state) => state.auth.currentUser);
  const subCategories = useSelector((state) => state.category.subCategories);

  const existingSkillId = currentUser?.skills?.[0] ?? null;
  const existingSkill = useSelector((state) =>
    existingSkillId
      ? state.skills.data.find((skill) => skill.id === existingSkillId)
      : undefined,
  );

  const from = (location.state as { from?: string })?.from || "/";

  useEffect(() => {
    if (existingSkillId && !existingSkill) {
      dispatch(fetchSkillById(existingSkillId));
    }
  }, [dispatch, existingSkillId, existingSkill]);

  if (
    existingSkill &&
    subCategories.length > 0 &&
    initializedSkillId !== existingSkill.id
  ) {
    const subcategory = subCategories.find(
      (sub) => sub.id === existingSkill.skillSubcategory,
    );

    setSkillName(existingSkill.title);
    setSkillDescription(existingSkill.description);
    setSkillImages(existingSkill.images);
    setSkillSubcategory(
      subcategory
        ? { value: subcategory.id, title: subcategory.name }
        : { value: existingSkill.skillSubcategory, title: "" },
    );
    setInitializedSkillId(existingSkill.id);
  }

  const handleSubmit = async () => {
    setRegistrationError(null);

    try {
      const skillData: TSkillData = {
        title: skillName,
        description: skillDescription,
        skillSubcategory: String(skillSubcategory?.value),
        images: skillImages,
      };

      if (existingSkillId) {
        await dispatch(
          changeSkill({ id: existingSkillId, ...skillData }),
        ).unwrap();
      } else {
        await dispatch(appendSkill(skillData)).unwrap();
      }

      navigate(from, {
        replace: true,
        state: { showRegistrationSuccess: true },
      });
    } catch (err) {
      setRegistrationError(handleError(err).message);
    }
  };

  return (
    <SkillRegister
      skillName={skillName}
      setSkillName={setSkillName}
      skillSubcategory={skillSubcategory}
      setSkillSubcategory={setSkillSubcategory}
      skillDescription={skillDescription}
      setSkillDescription={setSkillDescription}
      skillImages={skillImages}
      setSkillImages={setSkillImages}
      onBack={() => navigate(-1)}
      onSubmit={handleSubmit}
      errorText={registrationError || ""}
      isEditing={Boolean(existingSkillId)}
    />
  );
};
